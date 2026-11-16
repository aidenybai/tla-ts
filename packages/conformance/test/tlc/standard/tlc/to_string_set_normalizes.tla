(*---
description: "ToString normalizes an enumerated set: SetEnumValue.toString sorts, though ToString has no deepNormalize."
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE to_string_set_normalizes ----
EXTENDS TLC, Naturals
Test == ToString({2, 1}) = "{1, 2}" /\ ToString({1, 1}) = "{1}" /\ ToString({}) = "{}"
====

(*--- recorded
all:
  exit: 0
---*)
