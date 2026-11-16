(*---
description: Ported from TLC's ETest5.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/ETest5.java
features:
  - tlc-suite
outcome: parse-error
config: "  INIT

  \    Init

  \ \ 

  \  NEXT

  \    Next

  \ \ 

  \  INVARIANT Inv


  \ "
---*)
--------------- MODULE etest5  -------------

(* M!Ident for nonexistent module M. *)

EXTENDS TLC, Naturals

VARIABLE x

Init == /\ x = 1
        /\ Print("Should report error for nonexistent module M", TRUE)

Next == /\ UNCHANGED x
        /\ IF M!Init THEN TRUE
                     ELSE TRUE
        /\ Print("Should not get this far", TRUE)

Inv ==  TRUE

=========================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 36, col 15 to line 36, col 20 of module etest5
    | Unknown operator: `M!Init'.
    3002:1 Parsing or semantic analysis failed.
---*)
