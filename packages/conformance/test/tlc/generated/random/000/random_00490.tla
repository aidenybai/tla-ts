(*---
description: Evaluates a random function expression, seed 262, number 490.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00490 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((SubSeq(<<3, 1, 2>>, -1, 2) \o SubSeq(<<3, 1, 2>>, -1, 3)) :> (CHOOSE b802 \in {b803 \in {x \in 1..3 : x > 1} : TRUE} : (<<>> = [x \in Nat |-> x + 1]))) EXCEPT ![IF ({b804 \in [x \in Nat |-> x + 1] : TRUE} = ({1, 2} \cup {1, 2})) THEN (([a |-> 1, b |-> TRUE]).a % (2147483647 \div -1)) ELSE IF (\A b805 \in {2, 1, 3} : TRUE) THEN (<<5, 6>>)[3] ELSE (2147483647 \div 0)] = (Cardinality(({x \in 1..3 : x > 1} \cup 2..1)) - (-(0 + 7)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 294 to line 14, col 297 of module random_00490 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 283.
    | Expression starting at line 14, column 283.
    | ExtendableExpr starting at line 14, column 282.
    | ExtendableExpr starting at line 14, column 254.
    | Expression starting at line 14, column 254.
    | Fatal errors while parsing TLA+ spec in file random_00490
    | In module random_00490
    | Could not parse module random_00490 from file random_00490.tla
    | *** Errors: 1
    | In module random_00490
    | Could not parse module random_00490 from file random_00490.tla
    3002:1 Parsing or semantic analysis failed.
---*)
