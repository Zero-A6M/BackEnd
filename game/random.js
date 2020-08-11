let Random = (function() {
    let Random = function(seed = new Date().getTime() % 2147483648) {
        let MBIG = 2147483647;
        let MSEED = 161803398;
        let MZ = 0;
        let inext;
        let inextp;
        let SeedArray = [];

        let ii;
        let mj, mk;

        let subtraction = (seed == -2147483648) ? 2147483647: Math.abs(seed);
        mj = MSEED - subtraction;
        SeedArray[55] = mj;
        mk = 1;
        for (let i = 1; i < 55; i++) {
            ii = (21*i)%55;
            SeedArray[ii] = mk;
            mk = mj - mk;
            if (mk < 0) mk+=MBIG;
            mj = SeedArray[ii];
        }
        for (let k = 1; k < 5; k++) {
            for (let i = 1; i < 56; i++) {
                SeedArray[i] -= SeedArray[1+(i+30)%55];
                if (SeedArray[i]<0) SeedArray[i]+=MBIG;
            }
        }
        inext = 0;
        inextp = 21;
        seed = 1;

        function InternalSample() {
            let retVal;
            let locINext = inext;
            let locINextp = inextp;

            if (++locINext >=56) locINext = 1;
            if (++locINextp >= 56) locINextp = 1;

            retVal = SeedArray[locINext] - SeedArray[locINextp];

            if (retVal === MBIG) retVal--;          
            if (retVal < 0) retVal += MBIG;

            SeedArray[locINext] = retVal;
 
            inext = locINext;
            inextp = locINextp;
                    
            return retVal;
        }

        function Sample() {
            return (InternalSample() * (1.0 / MBIG));
        }

        function GetSampleForLargeRange() {
            let result = InternalSample();
            let negative = (InternalSample() % 2 == 0) ? true : false;
            if (negative) {
                result = -result;
            }
            let d = result;
            d += (2147483647 - 1);
            d /= 2 * 2147483647 - 1;
            return d;
        }

        this.Next = function(maxValue, minValue) {
            if (maxValue === undefined && minValue === undefined) {
                return InternalSample();
            } else if (minValue < maxValue) {
                let range = maxValue - minValue;
                if (range <= 2147483647) {
                    return Math.floor((Sample() * range) + minValue);
                } else {
                    return Math.floor((GetSampleForLargeRange() * range) + minValue);
                }
            } else if (maxValue > 0) {
                return Math.floor(Sample() * maxValue);
            }

            return 0;
        }

        this.NextBytes = function(buffer, length) {
            if (length === undefined || length <= 0) return 0;
            for (let i = 0; i < length; i++) {
                buffer[i] = Math.abs(InternalSample() % 256);
            }
        }

        this.NextFloor = function() {
            return Sample();
        }
    }

    return Random;
})();

module.exports.Random = Random;