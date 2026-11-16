(*---
description: Evaluates a random function expression, seed 262, number 337.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00337 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} -> {1, 2}] : TRUE) EXCEPT ![Head(SubSeq(Append(<<3, 1, 2>>, 2), (3 * -1), Head(<<>>)))] = (CHOOSE b566 \in DOMAIN [b567 \in {2, 1, 3} |-> b567] : ({b566 : b568 \in 1..3} = ({2, 1, 3} \cap SUBSET {1})))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 106 to line 14, col 106 of module random_00337 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 104.
    | Expression starting at line 14, column 104.
    | ExtendableExpr starting at line 14, column 103.
    | Expression starting at line 14, column 103.
    | Optional Arguments starting at line 14, column 78.
    | Fatal errors while parsing TLA+ spec in file random_00337
    | In module random_00337
    | Could not parse module random_00337 from file random_00337.tla
    | *** Errors: 1
    | In module random_00337
    | Could not parse module random_00337 from file random_00337.tla
    3002:1 Parsing or semantic analysis failed.
---*)
