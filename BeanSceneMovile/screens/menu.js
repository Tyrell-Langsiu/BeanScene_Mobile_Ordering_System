import {View, Text, StyleSheet} from 'react-native';

export default function MenuScreen() {
    return (
        <View style = {styles.container}>
            <Text>Menu Screen</Text>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
})
