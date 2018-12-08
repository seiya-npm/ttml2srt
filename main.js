function ttml2srt(data,forceFps) {
    // get framerate
    const FPSnumMatch = data.match(/ttp:frameRate="(\d+)"/);
    const FPSmulMatch = data.match(/ttp:frameRateMultiplier="(\d+) (\d+)"/);
    const FPSnum      = FPSnumMatch ? parseInt(FPSnumMatch[1]) : 0; // numerator
    const FPSmul      = FPSmulMatch ? parseInt(FPSmulMatch[1]) : 1; // multiplier
    const FPSden      = FPSmulMatch ? parseInt(FPSmulMatch[2]) : 1; // denominator
    let frameRate     = FPSnum * FPSmul / FPSden;
    frameRate         = forceFps ? forceFps : frameRate;
    if((frameRate ^ 0) !== frameRate){
        frameRate = frameRate.toFixed(3);
    }
    console.info(`[INFO] FRAMERATE IS ${frameRate>0?frameRate:'UNKNOWN\n[WARN] TIMING MAY BE INCORRECT'}`);
    // pre build srt
    let outSrt = '', str_id = 0;
    let ptime  = '', сtime  = '';
    // build srt
    const ttmlStr  = '<p.*?begin="([^"]*)" end="([^"]*)".*?>(.*?)</p>';
    for (let x of data.match(new RegExp(ttmlStr,'g'))) {
        let m = x.match(new RegExp(ttmlStr));
        if (m) {
            let begin = formatSrtTime(m[1], frameRate);
            let end = formatSrtTime(m[2], frameRate);
            let text = m[3]
                .replace(/(<br.*?>)+/g, '\r\n')
                .replace(/<\/br>/g, '')
                .replace(/&apos;/g, '\'')
                .replace(/&quot;/g, '"')
                .replace(/<[^>]*\/>/g,'')
                .replace(/<(\S*?) (.*?)>(.*?)<\/.*?>/g, fontRepl);
            if(text.trim() !== ''){
                сtime = `${begin} --> ${end}`;
                if(ptime != сtime){
                    ptime = сtime;
                    str_id++;
                    if(outSrt != ''){
                        outSrt += `\r\n\r\n`;
                    }
                    outSrt += `${str_id}\r\n${сtime}\r\n`;
                }
                else{
                    outSrt += `\r\n`;
                }
                outSrt += `${text}`;
            }
        }
    }
    outSrt += `\r\n\r\n`;
    const startTagMatch = /([^\s])<(\w)/g
    if(outSrt.match(startTagMatch)){
        outSrt = outSrt.replace(startTagMatch,'$1 <$2')
    }
    const endTagMatch = /<\/(\w+)>([^\s])/g
    if(outSrt.match(endTagMatch)){
        outSrt = outSrt.replace(endTagMatch,'</$1> $2')
    }
    return `\uFEFF${outSrt}`;
}
function formatSrtTime(time, frameRate) {
    let t = time.match(/(\d*:\d*:\d*)(.*)$/);
    let f = t[2]
    if (f.length == 0) {
        return `${t[1]},000`
    }
    if (f[0] === '.') {
        let ms = f.substr(1).padEnd(3, '0').substr(0, 3)
        return `${t[1]},${ms}`
    }
    if (f[0] === ':' && frameRate > 0) {
        let ms = Math.floor(parseFloat(f.substr(1)) * 1000 / frameRate).toString();
        return t[1] + ',' + ms.padStart(3, '0');
    }
    // invalid time
    return `${t[1]},000`;
}
function fontRepl(str, tag, attrs, txt) {
    if (tag != 'span') {
        return txt;
    }
    let at = attrs.replace(/\s*=\s*/g,'=').split(' ').filter(x => x.trim());
    for (let a of at) {
        let ax = a.match(/tts:color="(.*?)"/);
        if (ax) {
            txt = `<font color="${ax[1]}">${txt.trim()}</font>`;
            continue;
        }
        switch (a) {
            case 'tts:fontStyle="italic"':
                txt = `<i>${txt.trim()}</i>`;
                break;
            case 'tts:textDecoration="underline"':
                txt = `<u>${txt.trim()}</u>`;
                break;
            case 'tts:fontWeight="bold"':
                txt = `<b>${txt.trim()}</b>`;
                break;
        }
    }
    return txt;
}

// output
module.exports = { ttml2srt };
