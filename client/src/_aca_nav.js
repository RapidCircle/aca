export default {
  items: [
    {
      name: 'Dashboard',
      url: '/dashboard',
      icon: 'icon-speedometer',
      badge: {
        variant: 'info',
        text: 'HOME',
      },
    },
    {
      title: true,
      name: 'Workflows',
      wrapper: {            // optional wrapper object
        element: '',        // required valid HTML5 element tag
        attributes: {}        // optional valid JS object with JS API naming ex: { className: "my-class", style: { fontFamily: "Verdana" }, id: "my-id"}
      },
      class: ''             // optional class names space delimited list for title item ex: "text-center"
    },
    {
      name: 'Active',
      url: '/theme/colors',
      icon: 'icon-drop',
    },
    {
      name: 'History',
      url: '/theme/typography',
      icon: 'icon-pencil',
    },
    {
      title: true,
      name: 'Resources',
      wrapper: {
        element: '',
        attributes: {},
      },
    },
    {
      name: 'By group',
      url: '/base',
      icon: 'icon-puzzle'      
    },
    {
      name: 'By name',
      url: '/buttons',
      icon: 'icon-cursor'      
    },
    {
      name: 'By label',
      url: '/charts',
      icon: 'icon-pie-chart',
    },
    {
      name: 'Inactive',
      url: '/icons',
      icon: 'icon-star',
    },
    {
      name: 'Free',
      url: '/notifications',
      icon: 'icon-bell'      
    },
    {
      divider: true,
    },
    {
      title: true,
      name: 'Costs',
    },
    {
      name: 'By group',
      url: '/pages',
      icon: 'fa-object-ungroup'
    },
    {
      name: 'By type',
      url: '/dashboard',
      icon: 'icon-ban'
    },
    {
      name: 'Goto Azure Portal',
      url: 'https://coreui.io/react/',
      icon: 'icon-cloud-download',
      class: 'mt-auto',
      variant: 'success',
      attributes: { target: '_blank', rel: "noopener" },
    }
  ],
};
