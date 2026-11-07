(*---
description: Ported from TLC's Github1109aTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github1109aTest.java
features:
  - tlc-regression
outcome: config-error
args:
  - -config
  - Github1109a.tla
  - -deadlock
---*)
---------------------------- MODULE Github1109a ---------------------------
EXTENDS Sequences

CONSTANTS C

VARIABLE x

C2 == x \* References variable, so C2 is non-constant.

Init == x = C

Next == UNCHANGED x
==========================================================================
---------------------------- CONFIG Github1109a ---------------------------
CONSTANT C <- C2
INIT Init
NEXT Next
==========================================================================

(*--- recorded
all:
  exit: 151
  transcript: |-
    2281:1 The configuration file substitutes constant C with non-constant C2 - specifically: @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 19, col 7 to line 19, col 7 of module Github1109a
    2281:1 The configuration file substitutes constant C with non-constant C2 - specifically: @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 19, col 7 to line 19, col 7 of module Github1109a
---*)
