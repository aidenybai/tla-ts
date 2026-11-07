(*---
description: Evaluates a random int expression, seed 262, number 8173.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08173 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 - 2) \div Cardinality({x \in 1..3 : x > 1})) \in {(b12641 - b12641) : b12641 \in ([x \in 1..2 |-> x] \ {x \in 1..3 : x > 1})}) - IF ((7 \in {x \in 1..3 : x > 1}) <=> (FALSE <=> FALSE)) THEN CASE (-1 < -1) -> Len(<<3, 1, 2>>) [] OTHER -> (Nat \div -1) ELSE ((7 - 1) \div [b12642 \in SUBSET {1} |-> b12642])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 264 to line 14, col 267 of module random_08173 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 260.
    | Expression starting at line 14, column 260.
    | ExtendableExpr starting at line 14, column 259.
    | Expression starting at line 14, column 259.
    | Case Other Arm starting at line 14, column 250.
    | Fatal errors while parsing TLA+ spec in file random_08173
    | In module random_08173
    | Could not parse module random_08173 from file random_08173.tla
    | *** Errors: 1
    | In module random_08173
    | Could not parse module random_08173 from file random_08173.tla
    3002:1 Parsing or semantic analysis failed.
---*)
