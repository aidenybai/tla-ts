(*---
description: Ported from TLC's ETest2.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/ETest2.java
features:
  - tlc-suite
outcome: parse-error
config: |2+
    INIT
      Init
    
    NEXT
      Next
    
    INVARIANT Inv
---*)
--------------- MODULE etest2 -------------

(* Test that TLC complains if a operator is called with too few arguments. *)

EXTENDS TLC

VARIABLE x
Type == x \in BOOLEAN
Init == 
  /\ Print("Should complain that operator Foo is called with too few arguments", TRUE)
  /\ x = TRUE

Next == UNCHANGED x


Foo(a, b) == a /\ b

Inv ==  Foo(x)

=========================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 33, col 12 to line 33, col 14 of module etest2
    | The operator Foo requires 2 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
