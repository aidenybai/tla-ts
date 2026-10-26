---- MODULE Scoped_TTrace_1793058651 ----
EXTENDS Sequences, TLCExt, Toolbox, Scoped, Naturals, TLC

_expression ==
    LET Scoped_TEExpression == INSTANCE Scoped_TEExpression
    IN Scoped_TEExpression!expression
----

_trace ==
    LET Scoped_TETrace == INSTANCE Scoped_TETrace
    IN Scoped_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        count = (4)
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
    \*         IN J!JsonSerialize("Scoped_TTrace_1793058651.json", _TETrace)

=============================================================================

 Note that you can extract this module `Scoped_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `Scoped_TEExpression.tla` file takes precedence 
  over the module `Scoped_TEExpression` below).

---- MODULE Scoped_TEExpression ----
EXTENDS Sequences, TLCExt, Toolbox, Scoped, Naturals, TLC

expression == 
    [
        \* To hide variables of the `Scoped` spec from the error trace,
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
\*---- MODULE Scoped_TETrace ----
\*EXTENDS IOUtils, Scoped, TLC
\*
\*trace == IODeserialize("Scoped_TTrace_1793058651.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE Scoped_TETrace ----
EXTENDS Scoped, TLC

trace == 
    <<
    ([count |-> 0]),
    ([count |-> 1]),
    ([count |-> 2]),
    ([count |-> 3]),
    ([count |-> 4])
    >>
----


=============================================================================

---- CONFIG Scoped_TTrace_1793058651 ----
CONSTANTS
    Nat <- [ Naturals ] Small

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
\* Generated on Mon Oct 26 16:50:51 PDT 2026