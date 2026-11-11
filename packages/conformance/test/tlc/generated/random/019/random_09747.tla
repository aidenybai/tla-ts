(*---
description: Evaluates a random record expression, seed 262, number 9747.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09747 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = @ + ([[b15134 \in {1, 2} |-> 7] EXCEPT ![([a |-> 1, b |-> TRUE]).a] = (2 * -1)])[(Head(<<>>) - Head(<<1>>))]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 134 to line 14, col 134 of module random_09747 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 132.
    | Expression starting at line 14, column 132.
    | ExtendableExpr starting at line 14, column 131.
    | Expression starting at line 14, column 131.
    | Except Spec starting at line 14, column 100.
    | Fatal errors while parsing TLA+ spec in file random_09747
    | In module random_09747
    | Could not parse module random_09747 from file random_09747.tla
    | *** Errors: 1
    | In module random_09747
    | Could not parse module random_09747 from file random_09747.tla
    3002:1 Parsing or semantic analysis failed.
---*)
