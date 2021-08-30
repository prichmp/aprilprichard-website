import skymap from "./skymap";
const C2S = require('canvas2svg');

export default class Starfield 
{

    private static canvasWidth: number = 0;
    private static canvasHeight: number = 0;

    public static renderStarfield()
    {
        const width = 1920;
        const height = 1080;
        var ctx = new C2S(width,height);
        
        let max = -Infinity;
        let min = Infinity;
        for(const star of skymap)
        {
            const ra = Starfield.convertRa(star.RA);
            const dec = Starfield.convertDec(star.DEC);

            const x = ra*(width/360.0);
            const y = height - (dec*(height/180.0));

            const magnitude = Number.parseFloat(star.MAG);

            if(magnitude >= 7.00)
            {
                continue;
            }

            if(magnitude > max)
            {
                max = magnitude
            }

            if(magnitude < min)
            {
                min = magnitude
            }

            const radius = Starfield.convertMag(magnitude)*10;
            let color = Starfield.toColor(star["Title HD"]);

            Starfield.paintStar(ctx, x, y, radius, color);
        }

        //serialize your SVG
        var mySerializedSVG = (ctx as any).getSerializedSvg();
        console.log(mySerializedSVG)
    }

    public static paintStarfield(canvasId: string)
    {
        const c = document.getElementById(canvasId) as HTMLCanvasElement;

        const width  = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const height = window.innerHeight|| document.documentElement.clientHeight || document.body.clientHeight;
        c.width = width;
        this.canvasWidth = width;
        c.height = height;
        this.canvasHeight = height;

        const ctx: CanvasRenderingContext2D|null = c.getContext("2d");

        if(!ctx)
        {
            throw Error(`"${canvasId}" did not return a canvas context. `);
        }

        let max = -Infinity;
        let min = Infinity;
        for(const star of skymap)
        {
            const ra = Starfield.convertRa(star.RA);
            const dec = Starfield.convertDec(star.DEC);

            const x = ra*(width/360.0);
            const y = height - (dec*(height/180.0));

            const magnitude = Number.parseFloat(star.MAG);

            if(magnitude >= 7.00)
            {
                continue;
            }

            if(magnitude > max)
            {
                max = magnitude
            }

            if(magnitude < min)
            {
                min = magnitude
            }

            const radius = Starfield.convertMag(magnitude)*10;
            let color = Starfield.toColor(star["Title HD"]);

            // Vega
            // if(star["Title HD"] === "A0Va")
            // {
                
            //     color ="#00ff00";
            // }

            // // Big Dipper 
            // const bigDipper = [4295, 4301, 4554, 4660, 4905, 5054, 5191, 4295]
            // if(bigDipper.includes(star["harvard_ref_#"]))
            // {
            //     color = "#ff0000";
            // }

            // const orion = [2061, 1713, 1790, 1851, 1903, 1948, 1949, 2004, 1879, 1880, ]
            // if(orion.includes(star["harvard_ref_#"]))
            // {
            //     color = "#ffff00";
            // }

            Starfield.paintStar(ctx, x, y, radius, color);
        }

        console.log(`[${min}, ${max}]`);

    }

    public static convertMag(mag: number): number
    {
        // -1.46 (Sirius) = 1
        // 7.00 = 0

        return Math.pow((7.00-mag)/(7.00+1.46), 2)

    }

    public static convertRa(hms: string): number
    {
        const extractRegex = /^(\d+?):(\d+?):(\d+?.\d+)$/;
        const regexResult = extractRegex.exec(hms)

        if(!regexResult)
        {
            throw new Error(`No match found for "${hms}"`);
        }

        const hours = Number.parseInt(regexResult[1]);
        const mins = Number.parseInt(regexResult[2]);
        const secs = Number.parseFloat(regexResult[3]);

        let deg = 0.0;

        deg += hours*360.0/24.0;
        deg += mins*360.0/(24*60.0);
        deg += secs*360.0/(24*60*60.0);


        return deg;

    }

    public static convertDec(hms: string): number
    {
        const extractRegex = /^([-+])(\d+?):(\d+?):(\d+?.\d+)$/;
        const regexResult = extractRegex.exec(hms)

        if(!regexResult)
        {
            throw new Error(`No match found for "${hms}"`);
        }

        const direction = regexResult[1];
        const degrees = Number.parseInt(regexResult[2]);
        const mins = Number.parseInt(regexResult[3]);
        const secs = Number.parseFloat(regexResult[4]);

        let deg = 0.0;

        if(direction === "-")
        {
            deg -= degrees;
            deg -= mins/(360*60);
            deg -= secs/(360*60*60.0);
        }
        else 
        {
            deg += degrees;
            deg += mins/(360*60);
            deg += secs/(360*60*60.0);
        }
        

        deg += 90

        return deg;

    }

    private static colorMap = {
        o: '#9fbfff',
        b: '#a8c5ff',
        a: '#d8e3ff',
        f: '#fef9ff',
        g: '#ffede3',
        k: '#ffdab5',
        m: '#ffb56c'
    }

    private static toColor(type:string): string
    {
        const normalizedType = type.toLowerCase();
        const keys = Object.keys(this.colorMap);

        for(const key of keys)
        {
            if(normalizedType.startsWith(key))
            {
                return ((this.colorMap as any)[key] as string);
            }
        }

        return '#ffffff';

    }


    public static paintStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string)
    {
        ctx.moveTo(x,y)
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.stroke(); 
        ctx.fill();

    }
}

function test1()
{
    //   RA: 302.8250
    //   DEC: -0.8214
    const ra = "20:11:18.30" 
    const dec = "-00:49:17.00"

    const raDeg = Starfield.convertRa(ra);
    const decDeg = Starfield.convertDec(dec);

    console.log(`${ra} -> ${raDeg}`)
    console.log(`${dec} -> ${decDeg-90}`)
}

function test2()
{
    //   Right Ascension 101.287 degrees, Declination -16.716 degrees
    //   Right Ascension 06:45:09, Declination -16:42:58
    const ra = "6:45:09.00" 
    const dec = "-16:42:58.00"

    const raDeg = Starfield.convertRa(ra);
    const decDeg = Starfield.convertDec(dec);

    console.log(`${ra} -> ${raDeg}`)
    console.log(`${dec} -> ${decDeg-90}`)
}
