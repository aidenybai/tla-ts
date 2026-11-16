(*---
description: Evaluates a random record expression, seed 262, number 9493.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09493 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b14750 == (CHOOSE b14751 \in {2, 1, 3} : FALSE) IN ((1 :> 2))[b14750], b |-> ((~TRUE) <=> (\E b14752 \in 2..1 : <<1, 2>>))] EXCEPT !.a = ((-Cardinality({x \in 1..3 : x > 1})) * CASE (\E b14753 \in {1, 2} : FALSE) -> Tail(<<1>>) [] OTHER -> (--1))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 271 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 268.
    | Expression starting at line 14, column 268.
    | Case Other Arm starting at line 14, column 259.
    | CASE Expression starting at line 14, column 205.
    | ExtendableExpr starting at line 14, column 166.
    | Fatal errors while parsing TLA+ spec in file random_09493
    | In module random_09493
    | Could not parse module random_09493 from file random_09493.tla
    | *** Errors: 1
    | In module random_09493
    | Could not parse module random_09493 from file random_09493.tla
    3002:1 Parsing or semantic analysis failed.
---*)
