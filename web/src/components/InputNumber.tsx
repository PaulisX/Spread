export function InputNumber({id, value, className, min, max, onInput, onBlur }: {id:string, value?:number, className?:string|undefined, onInput?:(value:number)=>void|undefined, min:number, max:number, onBlur?:()=>void}){
    function removeNonNumber(e: React.ChangeEvent<HTMLInputElement>){
        const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
        const numberVal = +digitsOnly;//Math.max(Math.min(+digitsOnly, max),min);
        e.target.value = numberVal.toString();
        if(onInput)
            onInput(numberVal);
    }
    function cap(e:React.FormEvent<HTMLInputElement>){
        const numberVal = Math.max(Math.min(+e.currentTarget.value, max),min);
        e.currentTarget.value = numberVal.toString();
        if(onInput)
            onInput(numberVal);
        if(onBlur)
            onBlur();
    }
    return(
        <input onChange={(e)=>removeNonNumber(e)} onBlur={(e)=>cap(e)} type="text" id={id} className={className} value={value?.toString()}/>
    )
}