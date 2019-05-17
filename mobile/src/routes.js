import { createAppContainer, createSwitchNavigator, createStackNavigator } from 'react-navigation';

import Main from './pages/Main';
import Box from './pages/Box';

const Routes = createAppContainer(
    createSwitchNavigator({
        Main,
        Box,
    }),
);

export default Routes;