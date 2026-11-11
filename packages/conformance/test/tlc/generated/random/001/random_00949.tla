(*---
description: Evaluates a random set expression, seed 262, number 949.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00949 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b1525 \in {2, 1, 3} : FALSE) \div (1 \div [x \in Nat |-> x + 1])) :> Cardinality(({1, 2} \cup {x \in 1..3 : x > 1}))) \ (LET b1526 == Tail(<<3, 1, 2>>) IN (SUBSET {1} % b1526) .. IF (\A b1527 \in {2, 1, 3} : FALSE) THEN (2147483647 % 3) ELSE ([x \in 1..2 |-> x])[-1])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 183 to line 14, col 188 of module random_00949 and %.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 190.
    | Expression starting at line 14, column 183.
    | ExtendableExpr starting at line 14, column 182.
    | Expression starting at line 14, column 182.
    | Case Other Arm starting at line 14, column 148.
    | Fatal errors while parsing TLA+ spec in file random_00949
    | In module random_00949
    | Could not parse module random_00949 from file random_00949.tla
    | *** Errors: 1
    | In module random_00949
    | Could not parse module random_00949 from file random_00949.tla
    3002:1 Parsing or semantic analysis failed.
---*)
