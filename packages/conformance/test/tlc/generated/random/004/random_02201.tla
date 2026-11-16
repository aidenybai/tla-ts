(*---
description: Evaluates a random record expression, seed 262, number 2201.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02201 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF (\A b3460 \in (-1 .. 7) : (FALSE <=> FALSE)) THEN Head(SelectSeq(<<1>>, LAMBDA e : e > 0)) ELSE Head(SubSeq(<<>>, 0, 7)), b |-> [((<<3, 1, 2>> \o <<>>) \o [<<>> EXCEPT ![1] = 7]) EXCEPT ![1] = [[[a |-> 1] EXCEPT !.a = -1] EXCEPT !.a = (1 * -1)]]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 264 to line 14, col 264 of module random_02201 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 262.
    | Expression starting at line 14, column 262.
    | ExtendableExpr starting at line 14, column 261.
    | Expression starting at line 14, column 261.
    | Except Spec starting at line 14, column 255.
    | Fatal errors while parsing TLA+ spec in file random_02201
    | In module random_02201
    | Could not parse module random_02201 from file random_02201.tla
    | *** Errors: 1
    | In module random_02201
    | Could not parse module random_02201 from file random_02201.tla
    3002:1 Parsing or semantic analysis failed.
---*)
