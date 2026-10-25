import DefaultTheme from 'vitepress/theme'
import './style.css'

import NetworkProbe from './components/NetworkProbe.vue'
import DisasterRecoveryBox from './components/DisasterRecoveryBox.vue'
import SpeedTestChart from './components/SpeedTestChart.vue'
import ServiceMatrix from './components/ServiceMatrix.vue'
import AirportCard from './components/AirportCard.vue'
import AirportFilter from './components/AirportFilter.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('NetworkProbe', NetworkProbe)
    app.component('DisasterRecoveryBox', DisasterRecoveryBox)
    app.component('SpeedTestChart', SpeedTestChart)
    app.component('ServiceMatrix', ServiceMatrix)
    app.component('AirportCard', AirportCard)
    app.component('AirportFilter', AirportFilter)
  }
}
