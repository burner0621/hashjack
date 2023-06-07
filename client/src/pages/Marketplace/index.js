import React, { useState, useEffect } from 'react';

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { styled, useTheme } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';

import {
  Box,
  Backdrop,
  Toolbar,
  List,
  CssBaseline,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';

import {
  Menu,
  ChevronLeft,
  ChevronRight,
  SwapHorizontalCircle,
  LocalGroceryStore,
  PersonOutline
} from '@mui/icons-material';

import NavBar from '../../components/NavBar';
import Marketplace from './marketplace';
import Profile from './profile';

import { useHashConnect } from "../../assets/api/HashConnectAPIProvider.tsx";
import { getRequest, postRequest } from "../../assets/api/apiRequests";
import * as env from "../../env";

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

export default function MiniDrawer() {
  const { walletData } = useHashConnect();
  const { accountIds } = walletData;

  const [loadingView, setLoadingView] = useState(false);
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [drawerValue, setDrawerValue] = useState('Marketplace');

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <NavBar 
        onChangeDrawer = {(drawerName) => {
          setDrawerValue(drawerName);
        }}
      />
      <Box component="main" sx={{
        backgroundColor: '#ffc0ff',
        flexGrow: 1,
        p: 3
      }}>
        <DrawerHeader />
        {
          drawerValue == 'Marketplace' &&
          <Marketplace />
        }
        {
          drawerValue == 'Profile' && accountIds &&
          <Profile
            accountId={accountIds[0]}
          />
        }
      </Box>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loadingView}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}
