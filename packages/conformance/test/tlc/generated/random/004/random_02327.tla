(*---
description: Evaluates a random record expression, seed 262, number 2327.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02327 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF (1..3 \subseteq Nat) THEN (1 + 0) ELSE LET b3689 == 0 IN 1, b |-> (~([a |-> 1] = [a |-> 1]))] EXCEPT !.a = (CASE LET b3690 == -1 IN b3690 -> IF TRUE THEN 0 ELSE 0 [] OTHER -> (--1) + ((CHOOSE b3691 \in 1..3 : FALSE) \div (CHOOSE b3692 \in SUBSET {1} : FALSE)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 205 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 202.
    | Expression starting at line 14, column 202.
    | Case Other Arm starting at line 14, column 193.
    | CASE Expression starting at line 14, column 135.
    | Expression starting at line 14, column 135.
    | Fatal errors while parsing TLA+ spec in file random_02327
    | In module random_02327
    | Could not parse module random_02327 from file random_02327.tla
    | *** Errors: 1
    | In module random_02327
    | Could not parse module random_02327 from file random_02327.tla
    3002:1 Parsing or semantic analysis failed.
---*)
