import { LunarApi } from '@/services/LunarApi';
import {
  Button,
  Card,
  CircularProgress,
  Grid,
  Theme,
  Typography,
  useTheme,
} from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';
import { MsgSend, StdFee } from '@terra-money/terra.js';
import {
  useConnectedWallet,
  useWallet,
  WalletStatus,
} from '@terra-money/wallet-provider';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

interface OnboardingCardProps {
  number: string;
  title: string;
  caption: string;
  buttonText: string;
  status: number;
  onClick: any;
}

const OnboardingCard = ({
  number,
  title,
  caption,
  buttonText,
  onClick,
  status,
}: OnboardingCardProps) => {
  const theme = useTheme<Theme>();

  const getColor = () =>
    status === 2
      ? '#5DB521'
      : status === 1
      ? theme.palette.primary.main
      : 'rgba(0, 0, 0, .25)';

  const getBorder = () =>
    status === 1 ? `2px solid ${getColor()}` : `2px solid ${getColor()}`;

  return (
    <Card
      elevation={4}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '50px',
        height: '300px',
        border: getBorder(),
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          textAlign: 'center',
          fontSize: '32px',
          border: getBorder(),
          transform: 'translateY(-90px)',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: getColor(),
        }}
      >
        {status === 2 ? <CheckIcon fontSize="large" /> : number}
      </div>
      <Typography
        variant="h4"
        style={{ textAlign: 'center', fontWeight: 'bold' }}
      >
        {title}
      </Typography>

      <Typography
        variant="body1"
        style={{ textAlign: 'center', fontSize: '24px' }}
      >
        {caption}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        style={{
          visibility: status === 1 ? 'visible' : 'hidden',
          fontSize: '20px',
        }}
        onClick={onClick}
      >
        {buttonText}
      </Button>
    </Card>
  );
};

interface WelcomeCardsProps {
  hasPaymentMethods?: boolean;
  hasEmployees?: boolean;
  hasPerkGroup?: boolean;
}

const WelcomeCards = ({
  hasPaymentMethods = false,
  hasEmployees = false,
  hasPerkGroup = false,
}: WelcomeCardsProps) => {
  const [linkComplete, setLinkComplete] = useState(false);
  const {
    wallets,
    availableConnectTypes,
    availableInstallTypes,
    connect,
    status,
    install,
    disconnect,
  } = useWallet();
  const [loading, setLoading] = useState(false);

  const connectedWallet = useConnectedWallet();
  const router = useRouter();
  const { jwt: jwtString } = router.query;
  console.log('JWTSTRING');
  console.log(jwtString);

  return (
    <div>
      <Grid container spacing={8} style={{ padding: '100px 250px' }}>
        <Grid item xs={6}>
          <OnboardingCard
            number="1"
            title="Connect Your Wallet"
            caption="Connect the wallet you want to link to your discord account."
            buttonText="Connect Wallet"
            status={status === WalletStatus.WALLET_CONNECTED ? 2 : 1}
            onClick={() => {
              const chromeConnectType = availableConnectTypes.find(
                (connectType) => connectType === 'CHROME_EXTENSION',
              );
              if (chromeConnectType) {
                connect(chromeConnectType);
              }
            }}
          />
        </Grid>

        <Grid item xs={6}>
          <OnboardingCard
            number="2"
            title="Sign A Transaction"
            caption="Sign a transaction that will prove ownership of your wallet."
            buttonText="Sign Transaction"
            status={
              linkComplete
                ? 2
                : status === WalletStatus.WALLET_CONNECTED
                ? 1
                : 0
            }
            onClick={async () => {
              if (connectedWallet) {
                const verificationTransaction = await connectedWallet.sign({
                  fee: new StdFee(0, '0uusd'),
                  msgs: [
                    new MsgSend(
                      connectedWallet.walletAddress,
                      'terra1f5u6ds3q95jwl2y5ellsczuwd2349g68u8af4l',
                      { uusd: 0 },
                    ),
                  ],
                });
                setLoading(true);

                await LunarApi.post('/api/lunarVerify', {
                  wallet_address: connectedWallet.walletAddress,
                  public_key: verificationTransaction.result.public_key,
                  signature: verificationTransaction.result.signature,
                  stdSignMsgData: JSON.stringify(
                    verificationTransaction.result.stdSignMsgData,
                  ),
                  jwt: jwtString,
                });

                setLoading(false);
                setLinkComplete(true);
              }
            }}
          />
        </Grid>
      </Grid>
      {loading && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-50%)',
          }}
        >
          <CircularProgress />
        </div>
      )}
    </div>
  );
};

export default WelcomeCards;