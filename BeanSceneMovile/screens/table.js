import {View, Text, StyleSheet} from 'react-native';

export default function TableScreen() {
    return (
        <View style = {styles.container}>
            <Text>Table Screen</Text>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
})