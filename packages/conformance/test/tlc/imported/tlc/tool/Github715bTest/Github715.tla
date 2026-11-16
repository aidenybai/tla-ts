(*---
description: Ported from TLC's Github715bTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github715bTest.java
features:
  - tlc-regression
outcome: config-error
config: |
  SPECIFICATION SpecVar
args:
  - -deadlock
---*)
---- MODULE Github715 ----
VARIABLE x

Init == x = TRUE

Next == x' = ~x

Spec == Init /\ [][Next]_x

Prop == x

Prop2 == x = TRUE

Prop3 == TRUE

SpecVar == x
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2236:1 The operator x, which equals line 13, col 10 to line 13, col 10 of module Github715,
    cannot be used as a spec
---*)
