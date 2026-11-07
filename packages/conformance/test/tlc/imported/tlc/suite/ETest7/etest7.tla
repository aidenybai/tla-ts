(*---
description: Ported from TLC's ETest7.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/ETest7.java
features:
  - tlc-suite
outcome: config-error
config: |2+
    INIT
      Init
    
    NEXT
      Next
    
    INVARIANT Inv

    CONSTANT 
       C <- Foo
---*)
--------------- MODULE etest7  -------------

(* Test replacement of constant with nonconstant operator. *)

EXTENDS TLC, Naturals, Sequences

CONSTANT C

VARIABLE x

Foo == x

Next == x' = C

Init == /\ Print("TLC should complain about replacing the constant C", TRUE)
        /\ Print("by the nonconstant Foo", TRUE)
        /\ x = 2

Inv ==  x = 2

=========================================

(*--- recorded
all:
  exit: 151
  transcript: |-
    2281:1 The configuration file substitutes constant C with non-constant Foo - specifically: @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 29, col 8 to line 29, col 8 of module etest7
    2281:1 The configuration file substitutes constant C with non-constant Foo - specifically: @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 29, col 8 to line 29, col 8 of module etest7
---*)
