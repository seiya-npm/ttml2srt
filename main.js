function ttml2srt(data) {
    // get framerate
    const FPSnumMatch = data.match(/ttp:frameRate="(\d+)"/);
    const FPSmulMatch = data.match(/ttp:frameRateMultiplier="(\d+) (\d+)"/);
    const FPSnum      = FPSnumMatch ? parseInt(FPSnumMatch[1]) : 25; // numerator
    const FPSmul      = FPSmulMatch ? parseInt(FPSmulMatch[1]) : 1;  // multiplier
    const FPSden      = FPSmulMatch ? parseInt(FPSmulMatch[2]) : 1;  // denominator
    let frameRate     = FPSnum * FPSmul / FPSden;
    if((frameRate ^ 0) !== frameRate){
        frameRate = frameRate.toFixed(3);
    }
    console.info(`[INFO] FRAMERATE IS ${frameRate}`);
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
    let t = time.match(/(.*):([^:]*)$/);
    let ms = Math.floor(parseInt(t[2]) * 1000 / frameRate).toString();
    return t[1] + ',' + ms.padStart(3, '0');
}
function fontRepl(str, tag, attrs, txt) {
    if (tag != 'span') {
        return txt;
    }
    let at = attrs.replace(/\s*=\s*/g,'=').split(' ').filter(x => x.trim());
    for (let a of at) {
        let ax = a.match(/tts:color="(.*?)"/);
        if (ax) {
            txt = `<font color="${ax[1]}">${txt}</font>`;
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