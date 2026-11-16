(*---
description: Evaluates a random int expression, seed 262, number 6043.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06043 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((([x \in Nat |-> x + 1])[2147483647] = ((1 :> 2))[0]) => ((TRUE <=> FALSE) => (3 < 2147483647))) THEN (Tail(<<-1, [a |-> 1, b |-> TRUE]>>) \o SubSeq(Append(<<1>>, 1), (7 - 1), IF TRUE THEN 7 ELSE 0)) ELSE Head(<<(0 * -1), (7 \div 7)>>))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 235 to line 14, col 235 of module random_06043 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 233.
    | Expression starting at line 14, column 233.
    | ExtendableExpr starting at line 14, column 232.
    | Expression starting at line 14, column 232.
    | Some << -- >> or >>_ Form starting at line 14, column 230.
    | Fatal errors while parsing TLA+ spec in file random_06043
    | In module random_06043
    | Could not parse module random_06043 from file random_06043.tla
    | *** Errors: 1
    | In module random_06043
    | Could not parse module random_06043 from file random_06043.tla
    3002:1 Parsing or semantic analysis failed.
---*)
