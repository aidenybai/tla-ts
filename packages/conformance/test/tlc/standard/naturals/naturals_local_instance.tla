(*---
description: A LOCAL INSTANCE of Naturals gets the Java overrides.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE naturals_local_instance ----
EXTENDS TLC
LOCAL INSTANCE Naturals
Test == 1 + 1 = 2
====

(*--- recorded
all:
  exit: 0
---*)
