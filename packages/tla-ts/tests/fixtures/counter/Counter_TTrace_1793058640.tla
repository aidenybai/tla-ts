---- MODULE Counter_TTrace_1793058640 ----
EXTENDS Sequences, TLCExt, Counter, Toolbox, Naturals, TLC

_expression ==
    LET Counter_TEExpression == INSTANCE Counter_TEExpression
    IN Counter_TEExpression!expression
----

_trace ==
    LET Counter_TETrace == INSTANCE Counter_TETrace
    IN Counter_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        count = (3)
    )
----

_init ==
    /\ count = _TETrace[1].count
----

_next ==
    /\ \E i,j \in DOMAIN _TETrace:
        /\ \/ /\ j = i + 1
              /\ i = TLCGet("level")
        /\ count  = _TETrace[i].count
        /\ count' = _TETrace[j].count

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("Counter_TTrace_1793058640.json", _TETrace)

=============================================================================

 Note that you can extract this module `Counter_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `Counter_TEExpression.tla` file takes precedence 
  over the module `Counter_TEExpression` below).

---- MODULE Counter_TEExpression ----
EXTENDS Sequences, TLCExt, Counter, Toolbox, Naturals, TLC

expression == 
    [
        \* To hide variables of the `Counter` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        count |-> count
        
        \* Put additional constant-, state-, and action-level expressions here:
        \* ,_stateNumber |-> _TEPosition
        \* ,_countUnchanged |-> count = count'
        
        \* Format the `count` variable as Json value.
        \* ,_countJson |->
        \*     LET J == INSTANCE Json
        \*     IN J!ToJson(count)
        
        \* Lastly, you may build expressions over arbitrary sets of states by
        \* leveraging the _TETrace operator.  For example, this is how to
        \* count the number of times a spec variable changed up to the current
        \* state in the trace.
        \* ,_countModCount |->
        \*     LET F[s \in DOMAIN _TETrace] ==
        \*         IF s = 1 THEN 0
        \*         ELSE IF _TETrace[s].count # _TETrace[s-1].count
        \*             THEN 1 + F[s-1] ELSE F[s-1]
        \*     IN F[_TEPosition - 1]
    ]

=============================================================================



Parsing and semantic processing can take forever if the trace below is long.
 In this case, it is advised to uncomment the module below to deserialize the
 trace from a generated binary file.

\*
\*---- MODULE Counter_TETrace ----
\*EXTENDS IOUtils, Counter, TLC
\*
\*trace == IODeserialize("Counter_TTrace_1793058640.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE Counter_TETrace ----
EXTENDS Counter, TLC

trace == 
    <<
    ([count |-> 0]),
    ([count |-> 1]),
    ([count |-> 2]),
    ([count |-> 3])
    >>
----


=============================================================================

---- CONFIG Counter_TTrace_1793058640 ----
CONSTANTS
    Limit = 3

INVARIANT
    _inv

CHECK_DEADLOCK
    \* CHECK_DEADLOCK off because of PROPERTY or INVARIANT above.
    FALSE

INIT
    _init

NEXT
    _next

CONSTANT
    _TETrace <- _trace

ALIAS
    _expression
=============================================================================
\* Generated on Mon Oct 26 16:50:40 PDT 2026