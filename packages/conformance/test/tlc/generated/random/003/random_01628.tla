(*---
description: Evaluates a random int expression, seed 262, number 1628.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01628 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({x \in 1..3 : x > 1} \cup {}) = (Nat \cup {1})) <=> (UNION {{}, SUBSET {1}} = (SUBSET {1} \ 2))) <=> (Cardinality({2 : b2600 \in {}}) <=> ((3 \div -1) = CASE FALSE -> 3 [] OTHER -> -1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 162 to line 14, col 165 of module random_01628 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 160.
    | Expression starting at line 14, column 160.
    | ExtendableExpr starting at line 14, column 159.
    | Expression starting at line 14, column 159.
    | ExtendableExpr starting at line 14, column 158.
    | Fatal errors while parsing TLA+ spec in file random_01628
    | In module random_01628
    | Could not parse module random_01628 from file random_01628.tla
    | *** Errors: 1
    | In module random_01628
    | Could not parse module random_01628 from file random_01628.tla
    3002:1 Parsing or semantic analysis failed.
---*)
