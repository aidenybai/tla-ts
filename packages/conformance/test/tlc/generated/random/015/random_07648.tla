(*---
description: Evaluates a random seq expression, seed 262, number 7648.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07648 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((SubSeq((<<3, 1, 2>> \o <<3, 1, 2>>), ([x \in Nat |-> x + 1])[2], CASE FALSE -> 2147483647 [] OTHER -> 2) \o (SortSeq(<<1>>, LAMBDA p, q : p < q) \o SortSeq(<<1, 2>>, LAMBDA p, q : p < q))), IF ((7 % 2147483647) \subseteq ({1} \ 1..3)) THEN IF (\A b11772 \in {1} : FALSE) THEN (7 \div 3) ELSE (1 * 7) ELSE ((SUBSET {1} * 2147483647) \div ([a |-> 1]).a), Head(Append(<<-1, 2147483647>>, (CHOOSE b11773 \in {2, 1, 3} : TRUE)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 331 to line 14, col 336 of module random_07648 and *.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 338.
    | Expression starting at line 14, column 331.
    | ExtendableExpr starting at line 14, column 330.
    | Expression starting at line 14, column 330.
    | ExtendableExpr starting at line 14, column 329.
    | Fatal errors while parsing TLA+ spec in file random_07648
    | In module random_07648
    | Could not parse module random_07648 from file random_07648.tla
    | *** Errors: 1
    | In module random_07648
    | Could not parse module random_07648 from file random_07648.tla
    3002:1 Parsing or semantic analysis failed.
---*)
