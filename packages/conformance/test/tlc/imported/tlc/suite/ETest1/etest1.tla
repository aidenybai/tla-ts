(*---
description: Ported from TLC's ETest1.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/ETest1.java
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
--------------- MODULE etest1 -------------

(* Test that TLC complains if an operator is called with too many arguments. *)

EXTENDS TLC

VARIABLE x
Type == x \in BOOLEAN
Init == 
  /\ Print("Should complain that operator Foo is called with too many arguments", TRUE)
  /\ x = TRUE

Next == UNCHANGED x


Foo(a) == a 

Inv ==  Foo(x, x)

=========================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 33, col 12 to line 33, col 17 of module etest1
    | The operator Foo requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
