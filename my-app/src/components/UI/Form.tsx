import { Card } from '../UI/Card';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';




interface Field{
    label : string;
    type?: string;
    placeholder : string;
    value : string;
    onChange : (val:string) => void;
    required? : boolean;
}

interface FormProps{
    title : string;
    fields : Field[];
    onSubmit: (e: React.SyntheticEvent) => void;
    submitLabel? : string;
    loading? : boolean;
    message? : string;
    onCancel? : ()  => void;
}

export const Form = ({title, fields, onSubmit, submitLabel, loading, message, onCancel}: FormProps) => (
     <Card title={title}>
        <form onSubmit={onSubmit} className="auth-form">

            {fields.map((f, index)=>(

                <Input
                key={index}
                label={f.label}
                type={f.type || 'text'}
                placeholder={f.placeholder}
                value={f.value}
                onChange={f.onChange}
                required={f.required}
                />
            ))}
            <div className="form-actions">
                 <Button type="submit"  className="btn-save"  disabled={loading} > {loading ? 'Executing': submitLabel}</Button>

                 {onCancel &&
                 <Button type="button" className="btn-cancel" disabled={loading} variant="secondary" onClick={onCancel}>Cancel</Button>
                 }

            </div>
            {message && <p className={`status-message ${message.toLowerCase().includes('success') ? 'successfully' : 'warning'}`}>{message}</p>}
         

            </form>
         </Card>


);