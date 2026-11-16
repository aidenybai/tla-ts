(*---
description: Evaluates a random seq expression, seed 262, number 4869.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04869 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(SortSeq((<<3, 1, 2>> \o <<>>), LAMBDA p, q : p < q), Cardinality({b7583 : b7583 \in Nat})), (((CHOOSE r \in [a : 1..2] : TRUE)).a - (CHOOSE b7584 \in {b7585 \in {2, 1, 3} : FALSE} : (FALSE \/ TRUE))), IF ((CHOOSE b7586 \in {} : FALSE) \in {b7587 \in {} : TRUE}) THEN Head(<<-1, 2147483647>>) ELSE ((2 \div -1) - (-<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 331 to line 14, col 334 of module random_04869 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 329.
    | Expression starting at line 14, column 329.
    | ExtendableExpr starting at line 14, column 328.
    | Expression starting at line 14, column 328.
    | ExtendableExpr starting at line 14, column 327.
    | Fatal errors while parsing TLA+ spec in file random_04869
    | In module random_04869
    | Could not parse module random_04869 from file random_04869.tla
    | *** Errors: 1
    | In module random_04869
    | Could not parse module random_04869 from file random_04869.tla
    3002:1 Parsing or semantic analysis failed.
---*)
