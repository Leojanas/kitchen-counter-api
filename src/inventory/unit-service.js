const volumeUnits = ['gallons', 'quarts', 'pints','cups','ounces', 'tablespoons', 'teaspoons'];
const volumeConversions = [1,4,8,16,128,256,768];
const weightConversions = [1,16];
const weightUnits = ['pounds', 'ounces'];
const UnitService = {
    convertValue(item, unit){
        console.log('inside unit conversion')
        let originalValue = item.qty;
        let originalUnit = item.unit;
        let newValue = originalValue;
        if(volumeUnits.includes(originalUnit) && volumeUnits.includes(unit)){
            newValue = originalValue*volumeConversions[volumeUnits.indexOf(unit)]/volumeConversions[volumeUnits.indexOf(originalUnit)];
        }else if(weightUnits.includes(originalUnit) && weightUnits.includes(unit)){
            newValue = originalValue*weightConversions[weightUnits.indexOf(unit)/weightConversions[weightUnits.indexOf(originalUnit)]];
        }else{
            return 'Not a valid set of units for conversion'
        }
        console.log(newValue)
        return newValue

    },
}

module.exports = UnitService;