(*---
description: "A hexadecimal literal above 2^31 - 1 is rejected."
ref: "tlc2/tool/impl/SpecProcessor.java#NumeralKind"
flags: [expression]
outcome: tlc-error
---*)
---- MODULE hex_too_big ----
EXTENDS Integers
Test == \hFFFFFFFF = 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2265:1 TLC can't handle a number this big.
    \hFFFFFFFF
---*)
