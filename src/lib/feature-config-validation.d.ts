export type FeatureConfigurationValue = string | number | boolean;
export declare function validateFeatureConfiguration(
  featureKey: string,
  configuration: unknown
): configuration is Record<string, FeatureConfigurationValue>;
