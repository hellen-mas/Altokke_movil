Pod::Spec.new do |s|
  s.name = 'OpenpayNative'
  s.version = '0.1.0'

  s.summary = 'Integración nativa Openpay para ALTOKKE'
  s.description = 'Puente nativo Android e iOS para tokenización Openpay.'
  s.license = { :type => 'MIT' }
  s.author = 'ALTOKKE'
  s.homepage = 'https://github.com/expo/expo'
  s.source = { :git => 'https://github.com/expo/expo.git' }

  s.platform = :ios, '14.3'
  s.swift_version = '5.0'
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = 'ios/OpenpayNativeModule.swift'
  s.vendored_frameworks = 'ios/Frameworks/OpenpayKit.xcframework'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }
end