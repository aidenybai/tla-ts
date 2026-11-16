(*---
description: Evaluates a random record expression, seed 262, number 779.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00779 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Len((<<3, 1, 2>> \o <<3, 1, 2>>)), b |-> ((1..3 \subseteq Nat) => (<<>> = (1 :> 2)))] EXCEPT !.a = (((7 \div 7) - (3 \div -1)) * ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]).a)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 141 to line 14, col 144 of module random_00779 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 139.
    | Expression starting at line 14, column 139.
    | ExtendableExpr starting at line 14, column 138.
    | ExtendableExpr starting at line 14, column 125.
    | Expression starting at line 14, column 125.
    | Fatal errors while parsing TLA+ spec in file random_00779
    | In module random_00779
    | Could not parse module random_00779 from file random_00779.tla
    | *** Errors: 1
    | In module random_00779
    | Could not parse module random_00779 from file random_00779.tla
    3002:1 Parsing or semantic analysis failed.
---*)
