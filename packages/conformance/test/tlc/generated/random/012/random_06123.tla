(*---
description: Evaluates a random seq expression, seed 262, number 6123.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06123 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2 + 2) - CASE TRUE -> -1 [] OTHER -> -1) \in DOMAIN ([x \in Nat |-> x + 1] @@ [a |-> 1, b |-> TRUE])) <=> ((((1 :> 2))[7] + CASE FALSE -> 0 [] OTHER -> 7) = ((CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE))[(0 * -1)])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 224 to line 14, col 224 of module random_06123 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 222.
    | Expression starting at line 14, column 222.
    | ExtendableExpr starting at line 14, column 221.
    | Expression starting at line 14, column 221.
    | Some [] Form starting at line 14, column 220.
    | Fatal errors while parsing TLA+ spec in file random_06123
    | In module random_06123
    | Could not parse module random_06123 from file random_06123.tla
    | *** Errors: 1
    | In module random_06123
    | Could not parse module random_06123 from file random_06123.tla
    3002:1 Parsing or semantic analysis failed.
---*)
