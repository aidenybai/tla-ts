(*---
description: Evaluates a random set expression, seed 262, number 7151.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07151 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ((\A b10989 \in {x \in 1..3 : x > 1} : FALSE) /\ ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) -> CASE (Nat = {x \in 1..3 : x > 1}) -> (1 * 0) [] OTHER -> Len([a |-> 1, b |-> TRUE]) [] OTHER -> CASE (Nat = 2..1) -> Cardinality({1, 2}) [] OTHER -> ([a |-> 1, b |-> TRUE]).a, (Len(<<-1, 0>>) \div CASE (\A b10990 \in {1, 2} : FALSE) -> (-1 + -1) [] OTHER -> (7 \div -1))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 384 to line 14, col 387 of module random_07151 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 382.
    | Expression starting at line 14, column 382.
    | ExtendableExpr starting at line 14, column 381.
    | Expression starting at line 14, column 381.
    | Case Other Arm starting at line 14, column 372.
    | Fatal errors while parsing TLA+ spec in file random_07151
    | In module random_07151
    | Could not parse module random_07151 from file random_07151.tla
    | *** Errors: 1
    | In module random_07151
    | Could not parse module random_07151 from file random_07151.tla
    3002:1 Parsing or semantic analysis failed.
---*)
