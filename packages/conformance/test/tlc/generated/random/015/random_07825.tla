(*---
description: Evaluates a random function expression, seed 262, number 7825.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07825 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[b12081 \in UNION {2..1, {}} |-> (--1)] EXCEPT ![((-3) + CASE TRUE -> [a |-> 1, b |-> TRUE] [] OTHER -> 7)] = CASE (~7) -> ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) [] OTHER -> CASE [x \in 1..2 |-> x] -> 7 [] OTHER -> 2147483647] EXCEPT ![(LET b12082 == (2 % 2) IN (b12082 * 7) + (CHOOSE b12083 \in ({1} \cup {2, 1, 3}) : (<<1>> = 0)))] = ((LET b12084 == 1 IN b12084 * Len(<<3, 1, 2>>)) - ((2147483647 * 3) - (CHOOSE b12085 \in {1} : TRUE)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 54 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 51.
    | Expression starting at line 14, column 51.
    | Some [] Form starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_07825
    | In module random_07825
    | Could not parse module random_07825 from file random_07825.tla
    | *** Errors: 1
    | In module random_07825
    | Could not parse module random_07825 from file random_07825.tla
    3002:1 Parsing or semantic analysis failed.
---*)
