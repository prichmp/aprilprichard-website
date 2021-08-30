

export default class Waves 
{
    private static canvasWidth: number = 0;
    private static canvasHeight: number = 0;

    public static drawWaves(canvasId: string)
    {
        const period = 1;
        const amplitude = 1;

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

        for(let h =0; h<height; h+=10)
        {
            const grey = Math.floor((h/height)*256);
            this.drawSinWave(ctx, 0.01, 50-(h/height)*50, 100+h, `rgb(${grey}, ${grey}, ${grey})`);
        }
        

        
    }

    private static drawSinWave(ctx: CanvasRenderingContext2D, period: number, amplitude: number, heightOffset: number, color: string)
    {
        
        let y = (amplitude * Math.sin(period)) + heightOffset;

        ctx.moveTo(0,this.canvasHeight);
        // ctx.lineTo(0, y);

        ctx.beginPath();
        ctx.strokeStyle = color;
        for(let x=0; x<this.canvasWidth; x++)
        {
            const nextY = (amplitude * Math.sin(period*x)) + heightOffset;
            ctx.lineTo(x, nextY);
            
            y = nextY;
        }

        // ctx.lineTo(this.canvasWidth, this.canvasHeight);
        // ctx.lineTo(0,this.canvasHeight);
        // ctx.fillStyle = "aliceblue";
        // ctx.fill();
        ctx.stroke();
        
    }

    private static drawCurl(x: number, y: number, turns: number, width: number)
    {
        
    }
}