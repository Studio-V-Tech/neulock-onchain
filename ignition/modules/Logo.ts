import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LogoModule = buildModule("LogoModule", (m) => {
  const logo = m.contract("NeuLogo");

  return { logo };
});

export default LogoModule;