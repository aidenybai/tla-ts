(*---
description: Evaluates a random record expression, seed 262, number 9691.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09691 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (-1), b |-> (Nat \subseteq {2, 1, 3})] EXCEPT !.a = @ + ((2 \div -1) \div (0 \div 3))] EXCEPT !.a = LET b15033 == (-([a |-> 1, b |-> TRUE]).a) IN ([b15034 \in SUBSET {1} |-> b15033])[(3 - b15033)]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 85 to line 14, col 88 of module random_09691 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 83.
    | Expression starting at line 14, column 83.
    | ExtendableExpr starting at line 14, column 82.
    | Expression starting at line 14, column 82.
    | ExtendableExpr starting at line 14, column 81.
    | Fatal errors while parsing TLA+ spec in file random_09691
    | In module random_09691
    | Could not parse module random_09691 from file random_09691.tla
    | *** Errors: 1
    | In module random_09691
    | Could not parse module random_09691 from file random_09691.tla
    3002:1 Parsing or semantic analysis failed.
---*)
