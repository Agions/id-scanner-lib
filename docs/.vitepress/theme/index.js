import DefaultTheme from 'vitepress/theme';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 可在此处注册自定义组件
    // app.component('DemoComponent', DemoComponent);
  }
}; 