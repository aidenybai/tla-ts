(*---
description: 'A temporal property in a variable-free module with nothing else is rejected for the missing init: impliedTemporals are in the check.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  PROPERTY Prop
---*)
---- MODULE property_only_no_variables ----
Prop == []<>TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2231:1 The configuration file did not specify the initial state predicate.
---*)
