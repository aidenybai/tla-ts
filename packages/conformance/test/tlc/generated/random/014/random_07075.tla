(*---
description: Evaluates a random seq expression, seed 262, number 7075.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07075 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((Cardinality({b10868 : b10868 \in {1}}) .. ([[a |-> 1] EXCEPT !.a = -1]).a), ([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = (-1 \div -1)]).a, Len(<<(<<5, 6>> - 7), Cardinality(Nat)>>)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 152 to line 14, col 155 of module random_07075 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 150.
    | Expression starting at line 14, column 149.
    | ExtendableExpr starting at line 14, column 148.
    | Expression starting at line 14, column 148.
    | Except Spec starting at line 14, column 142.
    | Fatal errors while parsing TLA+ spec in file random_07075
    | In module random_07075
    | Could not parse module random_07075 from file random_07075.tla
    | *** Errors: 1
    | In module random_07075
    | Could not parse module random_07075 from file random_07075.tla
    3002:1 Parsing or semantic analysis failed.
---*)
