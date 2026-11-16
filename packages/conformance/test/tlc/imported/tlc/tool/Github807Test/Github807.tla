(*---
description: Ported from TLC's Github807Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github807Test.java
features:
  - tlc-regression
outcome: safety-violation
args:
  - -config
  - Github807.tla
  - -deadlock
---*)
---------------------------- MODULE Github807 ---------------------------
EXTENDS Naturals, TLCExt, TLC
VARIABLE x

Init == x = 0

Add(d,n) ==
    /\ x' = x + d
    /\ x' <= 10

Next(r) ==
    LET d == IF x = x THEN 1 ELSE 1
    IN Add(d,r)

IsNotTwo == x # 2

Spec == Init /\ [][Next(1)]_x

PostCondition ==
       /\ CounterExample =
                       [ action |->
                             { << <<1, [x |-> 0]>>,
                                  [ name |-> "Add",
                                    location |->
                                        [ beginLine |-> 13,
                                          beginColumn |-> 8,
                                          endLine |-> 13,
                                          endColumn |-> 15,
                                          module |-> "Github807" ] ],
                                  <<2, [x |-> 1]>> >>,
                               << <<2, [x |-> 1]>>,
                                  [ name |-> "Add",
                                    location |->
                                        [ beginLine |-> 13,
                                          beginColumn |-> 8,
                                          endLine |-> 13,
                                          endColumn |-> 15,
                                          module |-> "Github807" ] ],
                                  <<3, [x |-> 2]>> >> },
                         state |-> {<<1, [x |-> 0]>>, <<2, [x |-> 1]>>, <<3, [x |-> 2]>>} ]
       /\ TLCGet("spec") =
				       [ impliedinits |-> {}, impliedactions |-> {},
				  invariants |->
				      { [ name |-> "IsNotTwo",
				          location |->
				              [ beginLine |-> 15,
				                beginColumn |-> 13,
				                endLine |-> 15,
				                endColumn |-> 17,
				                module |-> "Github807" ],
				          coverage |-> [count |-> 3] ] },
				  impliedtemporals |-> {},
				  temporals |-> {},
				  actions |->
				      { [ name |-> "Add",
				          location |->
				              [ beginLine |-> 13,
				                beginColumn |-> 8,
				                endLine |-> 13,
				                endColumn |-> 15,
				                module |-> "Github807" ],
				          coverage |-> [generated |-> 6, distinct |-> 2] ] },
				  inits |->
				      { [ name |-> "Init",
				          location |->
				              [ beginLine |-> 5,
				                beginColumn |-> 9,
				                endLine |-> 5,
				                endColumn |-> 13,
				                module |-> "Github807" ],
				          coverage |-> [generated |-> 3, distinct |-> 3] ] },
				  variables |->
				      { [ name |-> "x",
				          coverage |-> [distinct |-> 1],
				          location |->
				              [ beginLine |-> 3,
				                beginColumn |-> 10,
				                endLine |-> 3,
				                endColumn |-> 10,
				                module |-> "Github807" ] ] },
				  actionconstraints |-> {},
				  constraints |-> {} ]
==============================================================================
---------------------------- CONFIG Github807 ----------------------------
SPECIFICATION Spec

INVARIANT IsNotTwo

POSTCONDITION PostCondition
===========================================================================

(*--- recorded
all:
  exit: 12
  transcript: |-
    | line 33, col 41 to line 33, col 41 of module Github807
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 14, col 10 to line 14, col 10 of module Github807.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 41, col 41 to line 41, col 41 of module Github807
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 14, col 10 to line 14, col 10 of module Github807.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 42, col 41 to line 42, col 41 of module Github807
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 14, col 10 to line 14, col 10 of module Github807.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 50, col 41 to line 50, col 41 of module Github807
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 14, col 10 to line 14, col 10 of module Github807.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 51, col 43 to line 51, col 43 of module Github807
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 14, col 10 to line 14, col 10 of module Github807.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 51, col 61 to line 51, col 61 of module Github807
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 14, col 10 to line 14, col 10 of module Github807.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 51, col 79 to line 51, col 79 of module Github807
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 14, col 10 to line 14, col 10 of module Github807.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant IsNotTwo is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Add line 24, col 8 to line 24, col 15 of module Github807>
    x = 1
    2217:4 3: <Add line 24, col 8 to line 24, col 15 of module Github807>
    x = 2
    2404:1 Postcondition PostCondition at line 31, col 8 to line 93, col 54 of module Github807 is false.
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
