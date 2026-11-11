(*---
description: 'A property with no INIT or SPECIFICATION fails with TLC_CONFIG_MISSING_INIT.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  PROPERTY Prop
---*)
---- MODULE property_without_spec_init_next ----
EXTENDS Naturals
VARIABLE x
Prop == <>(x = 2)
====

(*--- recorded
all:
  exit: 151
  transcript: 2231:1 The configuration file did not specify the initial state predicate.
---*)
