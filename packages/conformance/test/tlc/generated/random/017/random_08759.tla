(*---
description: Evaluates a random int expression, seed 262, number 8759.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08759 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (\E b13557 \in (SUBSET {1} \ {1, 2}) : (\E b13558 \in 1..3 : FALSE)) THEN (CHOOSE b13559 \in (SUBSET {1} \ SUBSET {1}) : [[x \in 1..2 |-> x] EXCEPT ![b13559] = b13559]) ELSE ((--1) * LET b13560 == 2147483647 IN b13560) .. ((CASE FALSE -> 2 [] OTHER -> -1 :> Head(<<1>>)) @@ DOMAIN (3 :> 3))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 198 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 195.
    | Expression starting at line 14, column 195.
    | ExtendableExpr starting at line 14, column 194.
    | Expression starting at line 14, column 194.
    | IF THEN ELSE starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_08759
    | In module random_08759
    | Could not parse module random_08759 from file random_08759.tla
    | *** Errors: 1
    | In module random_08759
    | Could not parse module random_08759 from file random_08759.tla
    3002:1 Parsing or semantic analysis failed.
---*)
