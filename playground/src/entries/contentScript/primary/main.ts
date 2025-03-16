import { createApp } from 'vue'
import { Module } from 'deco-ext'
import renderContent from '../renderContent'
import /* { ContentManager } from */'../check'
import Primary from './App.vue'

@Module({
  imports: [
    // ContentManager,
  ],
})
class App { }

const app = new App()

renderContent(
  import.meta.PLUGIN_WEB_EXT_CHUNK_CSS_PATHS,
  async (appRoot: HTMLElement) => {
    createApp(Primary).mount(appRoot)
    console.log('app', app)
  },
)
